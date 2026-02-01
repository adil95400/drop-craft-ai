import type { ModuleDocumentation } from '../types';

export const importDocumentation: ModuleDocumentation = {
  id: 'import',
  slug: 'import',
  title: 'Import Pro',
  subtitle: 'Orchestrateur d\'import multi-sources intelligent',
  description: 'Import Pro est l\'orchestrateur unifié pour alimenter votre catalogue depuis n\'importe quelle source: fichiers (CSV, Excel, XML, JSON), URLs de produits, plateformes e-commerce (Shopify, WooCommerce, Amazon...) ou génération IA pure.',
  icon: 'Upload',
  category: 'catalog',
  routes: ['/import', '/import/file', '/import/url', '/import/platform', '/import/ai', '/import/history'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
  estimatedReadTime: 18,
  lastUpdated: '2025-02-01',
  version: '4.0',
  tags: ['import', 'csv', 'scraping', 'aliexpress', 'shopify', 'amazon', 'ia', 'enrichissement'],
  
  overview: {
    purpose: 'Centraliser et simplifier l\'import de produits depuis toutes les sources possibles. L\'orchestrateur gère automatiquement le mapping des champs, l\'enrichissement IA, la déduplication et la validation qualité.',
    whenToUse: 'À chaque fois que vous devez ajouter des produits: lancement boutique, ajout fournisseur, migration depuis une autre plateforme, création de catalogue de test.',
    targetAudience: 'Du dropshipper important depuis AliExpress au retailer migrant 100 000 références depuis son ERP.',
    prerequisites: [
      'Avoir un compte ShopOpti+ actif',
      'Préparer ses fichiers au format compatible (si import fichier)',
      'Disposer des accès API pour les imports plateformes'
    ],
    keyFeatures: [
      '8+ sources d\'import supportées',
      'Mapping intelligent des champs avec suggestions IA',
      'Enrichissement automatique (titres, descriptions, attributs)',
      'Validation qualité pré-import avec prévisualisation',
      'Import par lots avec gestion des erreurs',
      'Historique complet avec possibilité de re-import',
      'Webhooks pour intégration CI/CD',
      'Mode "Quick Import" pour workflows rapides'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Importer 10 produits depuis AliExpress',
      description: 'Vous débutez en dropshipping et souhaitez tester quelques produits rapidement.',
      steps: [
        'Installez l\'extension Chrome ShopOpti+',
        'Naviguez sur AliExpress et ouvrez une fiche produit',
        'Cliquez sur l\'icône ShopOpti+ dans la barre d\'outils',
        'Configurez vos marges et paramètres',
        'Cliquez "Importer vers ShopOpti+"'
      ],
      expectedOutcome: 'Produit importé en 30 secondes avec images, variantes et description traduite.'
    },
    {
      level: 'intermediate',
      title: 'Migrer 1000 produits depuis un CSV fournisseur',
      description: 'Votre fournisseur vous envoie un fichier Excel avec ses références. Vous devez les intégrer rapidement.',
      steps: [
        'Accédez à Import Pro > Fichier',
        'Uploadez votre fichier CSV/Excel',
        'Utilisez le mapping assisté IA pour faire correspondre les colonnes',
        'Activez l\'enrichissement IA pour les descriptions manquantes',
        'Prévisualisez les 10 premiers produits',
        'Lancez l\'import en arrière-plan'
      ],
      expectedOutcome: '1000 produits importés en 15 minutes avec qualité homogène.'
    },
    {
      level: 'advanced',
      title: 'Configurer un flux d\'import automatique',
      description: 'Vous recevez des mises à jour catalogue quotidiennes de votre fournisseur via SFTP.',
      steps: [
        'Accédez à Import Pro > Automatisation',
        'Configurez la source SFTP (serveur, identifiants)',
        'Définissez le mapping et les règles de transformation',
        'Programmez l\'exécution (quotidienne à 6h)',
        'Configurez les alertes email en cas d\'erreur'
      ],
      expectedOutcome: 'Import automatique quotidien sans intervention manuelle.'
    },
    {
      level: 'expert',
      title: 'Migration complète depuis Shopify (50 000 produits)',
      description: 'Vous migrez une boutique Shopify complète vers ShopOpti+ pour centraliser votre gestion multicanale.',
      steps: [
        'Accédez à Import Pro > Plateforme > Shopify',
        'Connectez votre boutique via OAuth',
        'Sélectionnez les collections à importer',
        'Activez la synchronisation bidirectionnelle',
        'Lancez l\'import initial (traitement par lots de 500)',
        'Vérifiez le rapport de migration'
      ],
      expectedOutcome: 'Migration complète en 2h avec 100% des données préservées.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Choisir la source d\'import',
      description: 'Sur la page Import Pro, sélectionnez votre source: Fichier (CSV, Excel, XML, JSON), URL (scraping), Plateforme (Shopify, Amazon, AliExpress...) ou IA (génération pure).',
      tip: 'Pour de gros volumes, préférez l\'import fichier. Pour du dropshipping, utilisez l\'extension Chrome.'
    },
    {
      stepNumber: 2,
      title: 'Configurer le mapping des champs',
      description: 'L\'assistant de mapping affiche vos colonnes sources à gauche et les champs ShopOpti+ à droite. L\'IA suggère automatiquement les correspondances.',
      tip: 'Validez toujours les mappings suggérés. L\'IA a 95% de précision mais peut se tromper sur des noms de colonnes ambigus.',
      warning: 'Les champs obligatoires (titre, prix) doivent être mappés. L\'import échouera sinon.'
    },
    {
      stepNumber: 3,
      title: 'Configurer les transformations',
      description: 'Appliquez des règles sur vos données: multiplication prix (×1.5 pour marge), traduction automatique, nettoyage HTML, génération SKU...',
      tip: 'Créez des "presets" de transformation réutilisables pour vos imports récurrents.'
    },
    {
      stepNumber: 4,
      title: 'Activer l\'enrichissement IA',
      description: 'L\'IA peut compléter automatiquement: descriptions manquantes, attributs déduits, catégories suggérées, SEO optimisé.',
      tip: 'L\'enrichissement IA consomme des crédits. Activez-le uniquement sur les champs réellement manquants.',
      warning: 'Relisez toujours quelques produits enrichis pour valider le ton et l\'exactitude.'
    },
    {
      stepNumber: 5,
      title: 'Prévisualiser et valider',
      description: 'L\'écran de prévisualisation affiche les 10-50 premiers produits tels qu\'ils seront importés. Vérifiez la qualité avant de lancer.',
      tip: 'Cliquez sur un produit pour voir le détail complet et les avertissements éventuels.'
    },
    {
      stepNumber: 6,
      title: 'Lancer l\'import',
      description: 'Cliquez "Importer" pour lancer. Les petits volumes (< 100) sont traités immédiatement. Les gros volumes s\'exécutent en arrière-plan.',
      tip: 'Vous pouvez fermer la page. Une notification vous préviendra à la fin.'
    },
    {
      stepNumber: 7,
      title: 'Traiter les erreurs',
      description: 'Le rapport d\'import liste les produits échoués avec la raison. Téléchargez le fichier d\'erreurs, corrigez et réimportez uniquement ces lignes.',
      tip: 'Les erreurs fréquentes: prix non numérique, SKU en double, URL image invalide.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Utilisez des fichiers propres',
        description: 'Supprimez les lignes vides, les caractères spéciaux dans les en-têtes, et encodez en UTF-8. 80% des erreurs viennent de fichiers mal formatés.',
        impact: 'high'
      },
      {
        title: 'Testez sur 10 produits d\'abord',
        description: 'Avant d\'importer 10 000 références, validez votre mapping et vos transformations sur un échantillon.',
        impact: 'high'
      },
      {
        title: 'Créez des presets réutilisables',
        description: 'Si vous importez régulièrement du même fournisseur, sauvegardez votre configuration en preset.',
        impact: 'medium'
      },
      {
        title: 'Planifiez les gros imports la nuit',
        description: 'Les imports > 10 000 produits sont plus rapides hors heures de pointe.',
        impact: 'low'
      }
    ],
    pitfalls: [
      {
        title: 'Importer sans déduplication',
        description: 'Relancer un import sans activer la déduplication crée des doublons. Activez "Mettre à jour les existants" si le SKU existe.',
        impact: 'high'
      },
      {
        title: 'Ignorer la prévisualisation',
        description: 'Sauter l\'étape de preview = risquer d\'importer des données corrompues. Toujours vérifier.',
        impact: 'high'
      },
      {
        title: 'Enrichir à 100% sans relecture',
        description: 'L\'IA génère du contenu cohérent mais pas toujours exact. Relisez un échantillon.',
        impact: 'medium'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'L\'import échoue à "Analyse du fichier"',
      cause: 'Fichier corrompu, encodage incorrect ou format non supporté',
      solution: 'Ouvrez le fichier dans Excel, sauvegardez en CSV UTF-8, et réessayez',
      severity: 'high'
    },
    {
      symptom: 'Les prix sont tous à 0',
      cause: 'Colonne prix non mappée ou format non reconnu (virgule vs point décimal)',
      solution: 'Vérifiez le mapping et le format. Utilisez le point comme séparateur décimal.',
      severity: 'high'
    },
    {
      symptom: 'Les images ne s\'importent pas',
      cause: 'URLs expirées, serveur source bloquant le scraping, ou format non supporté',
      solution: 'Testez les URLs manuellement. Activez "Héberger les images" pour copier sur ShopOpti+',
      severity: 'medium'
    },
    {
      symptom: 'L\'import AliExpress/Amazon est bloqué',
      cause: 'Protection anti-bot ou limite de requêtes atteinte',
      solution: 'Attendez 1h et réessayez. Utilisez l\'extension Chrome pour des imports ponctuels',
      severity: 'medium'
    },
    {
      symptom: 'Les variantes ne sont pas créées',
      cause: 'Format de variantes non standard ou colonnes non mappées',
      solution: 'Utilisez le format "Taille:S|M|L;Couleur:Noir|Blanc" ou mappez chaque colonne variante',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'Le "Golden CSV Template"',
      content: 'Créez un template CSV maître avec tous vos champs standardisés. Demandez à vos fournisseurs de l\'utiliser. Vous passez de 30min de mapping à 30 secondes.',
      differentiator: 'ShopOpti+ fournit des templates optimisés par secteur (mode, électronique, maison...).'
    },
    {
      title: 'Import différentiel intelligent',
      content: 'Pour les flux quotidiens, activez le mode "différentiel". Seuls les produits modifiés sont traités, réduisant le temps d\'import de 90%.',
      differentiator: 'Notre algorithme détecte les changements au niveau du champ, pas juste du produit.'
    },
    {
      title: 'Webhooks pour CI/CD',
      content: 'Intégrez Import Pro dans votre pipeline: déclenchez un import via API, recevez le résultat par webhook, automatisez les actions suivantes.',
      differentiator: 'API REST complète avec documentation OpenAPI et SDK JS/Python.'
    },
    {
      title: 'Scoring pré-import',
      content: 'Activez le scoring qualité en prévisualisation. Les produits sous le seuil (ex: < 60) peuvent être exclus automatiquement de l\'import.',
      differentiator: 'Évitez de polluer votre catalogue avec des produits non publiables.'
    }
  ],
  
  callToValue: {
    headline: 'Importez 10 000 produits en 15 minutes',
    description: 'Import Pro automatise 90% du travail d\'intégration catalogue. Plus besoin de reformater des fichiers Excel pendant des heures ou de copier-coller des fiches produits une par une.',
    metrics: [
      { label: 'Temps import 1000 produits', value: '8 min', improvement: '-95% vs manuel' },
      { label: 'Taux de succès import', value: '99.2%', improvement: '' },
      { label: 'Sources supportées', value: '15+', improvement: '' }
    ],
    cta: {
      label: 'Lancer un import',
      route: '/import'
    }
  },
  
  faqs: [
    {
      question: 'Quels formats de fichiers sont supportés ?',
      answer: 'CSV, XLSX (Excel), XML, JSON, et TSV. Pour les formats propriétaires (ERP spécifiques), exportez d\'abord en CSV.'
    },
    {
      question: 'Combien de produits puis-je importer à la fois ?',
      answer: 'Techniquement illimité. Standard: 5000/import. Pro: 50000/import. Ultra Pro: illimité. Les très gros imports (>100k) sont traités par lots automatiquement.'
    },
    {
      question: 'L\'import depuis AliExpress est-il légal ?',
      answer: 'Oui pour un usage dropshipping. Vous importez les données produits pour les revendre, ce qui est l\'usage prévu. Respectez les conditions d\'utilisation AliExpress.'
    },
    {
      question: 'Puis-je annuler un import en cours ?',
      answer: 'Oui, cliquez sur "Annuler" dans la barre de progression. Les produits déjà importés resteront, les suivants seront ignorés.'
    },
    {
      question: 'Comment gérer les mises à jour de prix fournisseur ?',
      answer: 'Configurez un import automatique avec l\'option "Mettre à jour les existants". Seul le prix sera modifié, le reste de la fiche sera préservé.'
    }
  ],
  
  relatedModules: ['products', 'suppliers', 'catalog', 'ai'],
  externalResources: [
    { label: 'Templates d\'import par secteur', url: '/templates/import' },
    { label: 'Documentation API Import', url: '/developers/api/import' },
    { label: 'Extension Chrome ShopOpti+', url: '/extension' }
  ]
};
