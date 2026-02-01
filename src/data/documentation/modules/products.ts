import type { ModuleDocumentation } from '../types';

export const productsDocumentation: ModuleDocumentation = {
  id: 'products',
  slug: 'products',
  title: 'Gestion des Produits',
  subtitle: 'Catalogue intelligent et édition en masse',
  description: 'Le module Produits est le cœur opérationnel de ShopOpti+. Il vous permet de gérer, enrichir et optimiser l\'intégralité de votre catalogue avec des outils d\'édition en masse, de scoring qualité et de règles automatisées.',
  icon: 'Package',
  category: 'catalog',
  routes: ['/products', '/products/audit', '/products/scoring', '/products/rules'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
  estimatedReadTime: 15,
  lastUpdated: '2025-02-01',
  version: '3.0',
  tags: ['catalogue', 'produits', 'édition en masse', 'qualité', 'scoring', 'automatisation'],
  
  overview: {
    purpose: 'Centraliser et optimiser la gestion de votre catalogue produits. Le module offre une vue tabulaire puissante inspirée de Channable, avec édition inline, filtres avancés et actions en masse.',
    whenToUse: 'Utilisez ce module pour toute opération sur vos produits: création, modification, enrichissement IA, audit qualité, application de règles de prix ou publication multicanale.',
    targetAudience: 'Du vendeur solo gérant 50 produits à l\'agence pilotant 100 000+ références pour ses clients.',
    prerequisites: [
      'Avoir importé au moins un produit via Import Pro ou connexion boutique',
      'Comprendre les notions de base (SKU, variantes, attributs)'
    ],
    keyFeatures: [
      'Vue tabulaire Channable-style avec colonnes personnalisables',
      'Édition inline directe sans popup',
      'Sélection multiple et actions en masse (100+ produits)',
      'Filtres avancés combinables (statut, catégorie, marge, score...)',
      'Scoring qualité automatique avec recommandations IA',
      'Règles de transformation automatisées',
      'Historique des modifications avec rollback',
      'Export multi-format (CSV, Excel, JSON)'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Créer et enrichir ses premiers produits',
      description: 'Vous débutez et souhaitez ajouter manuellement des produits ou enrichir ceux importés automatiquement.',
      steps: [
        'Accédez à Produits dans le menu principal',
        'Cliquez sur "Ajouter un produit" ou sélectionnez un produit existant',
        'Remplissez les champs obligatoires (titre, prix, SKU)',
        'Utilisez "Enrichir avec l\'IA" pour générer description et attributs',
        'Ajoutez des images de qualité (min 1000x1000px)',
        'Publiez vers vos canaux de vente'
      ],
      expectedOutcome: 'Un produit complet, optimisé SEO et prêt à la vente en moins de 5 minutes.'
    },
    {
      level: 'intermediate',
      title: 'Optimiser un catalogue de 500+ produits',
      description: 'Votre catalogue s\'agrandit et vous devez maintenir une qualité homogène sans y passer des heures.',
      steps: [
        'Filtrez par "Score < 70" pour identifier les produits à améliorer',
        'Sélectionnez tous les produits filtrés (checkbox en haut)',
        'Utilisez "Actions > Enrichir en masse avec IA"',
        'Appliquez une règle de prix automatique (+30% marge minimum)',
        'Vérifiez les résultats et validez la publication'
      ],
      expectedOutcome: 'Catalogue optimisé en 30 minutes au lieu de 3 jours.'
    },
    {
      level: 'expert',
      title: 'Gérer 50 000+ produits pour une agence',
      description: 'Vous gérez le catalogue de plusieurs clients avec des règles différentes par marque, catégorie ou marketplace.',
      steps: [
        'Créez des vues sauvegardées par client/catégorie',
        'Configurez des règles de transformation automatiques',
        'Utilisez l\'API pour synchroniser avec votre PIM externe',
        'Activez les webhooks pour les notifications temps réel',
        'Déléguez des droits granulaires à votre équipe'
      ],
      expectedOutcome: 'Gestion industrialisée avec 0 intervention manuelle sur 90% des opérations.'
    }
  ],
  
  stepByStep: [
    {
      stepNumber: 1,
      title: 'Naviguer dans la vue produits',
      description: 'La vue principale affiche vos produits en tableau. Utilisez la barre de recherche pour trouver un produit par titre, SKU ou ID. Les colonnes sont redimensionnables et réorganisables.',
      tip: 'Double-cliquez sur un en-tête de colonne pour trier. Ctrl+clic pour un tri multi-colonnes.'
    },
    {
      stepNumber: 2,
      title: 'Éditer un produit inline',
      description: 'Cliquez sur n\'importe quelle cellule pour l\'éditer directement. Les modifications sont sauvegardées automatiquement après 2 secondes d\'inactivité.',
      tip: 'Utilisez Tab pour passer à la cellule suivante, Entrée pour valider.',
      warning: 'Les modifications sont appliquées immédiatement. Utilisez l\'historique pour annuler si besoin.'
    },
    {
      stepNumber: 3,
      title: 'Utiliser les filtres avancés',
      description: 'Cliquez sur "Filtres" pour ouvrir le panneau. Combinez plusieurs critères: catégorie + marge > 20% + stock > 0 + score > 70.',
      tip: 'Sauvegardez vos combinaisons de filtres fréquentes en "Vue personnalisée".'
    },
    {
      stepNumber: 4,
      title: 'Exécuter des actions en masse',
      description: 'Cochez les produits concernés (ou "Tout sélectionner"), puis cliquez sur "Actions". Choisissez: modifier prix, changer catégorie, enrichir IA, publier, archiver...',
      tip: 'Pour de gros volumes (>1000), l\'action s\'exécute en arrière-plan avec notification.',
      warning: 'Prévisualisez toujours le résultat sur 5 produits avant d\'appliquer à tout le catalogue.'
    },
    {
      stepNumber: 5,
      title: 'Configurer des règles automatiques',
      description: 'Allez dans Produits > Règles. Créez des règles IF/THEN: "Si catégorie = Électronique ET marge < 15%, ALORS désactiver la publication".',
      tip: 'Les règles s\'exécutent à chaque import et modification. Ordonnez-les par priorité.'
    },
    {
      stepNumber: 6,
      title: 'Analyser le scoring qualité',
      description: 'Chaque produit a un score 0-100 basé sur 12 critères. Cliquez sur le score pour voir le détail et les recommandations d\'amélioration.',
      tip: 'Visez un score moyen > 85 pour maximiser votre visibilité marketplace.'
    }
  ],
  
  bestPractices: {
    recommendations: [
      {
        title: 'Établissez une nomenclature de titres',
        description: 'Format recommandé: [Marque] + [Produit] + [Caractéristique clé] + [Taille/Couleur]. Ex: "Nike Air Max 90 Sneakers Homme Noir 43".',
        impact: 'high'
      },
      {
        title: 'Utilisez des images de qualité uniforme',
        description: 'Fond blanc, 1200x1200px minimum, 5+ angles par produit. L\'IA peut générer des fonds blancs automatiquement.',
        impact: 'high'
      },
      {
        title: 'Renseignez tous les attributs marketplace',
        description: 'Chaque marketplace a ses attributs obligatoires (GTIN, marque, matière...). Un produit incomplet = visibilité réduite de 60%.',
        impact: 'high'
      },
      {
        title: 'Créez des règles de prix dynamiques',
        description: 'Automatisez: marge minimum 25%, arrondi prix psychologique (.99), ajustement concurrence ±5%.',
        impact: 'medium'
      }
    ],
    pitfalls: [
      {
        title: 'Dupliquer manuellement les variantes',
        description: 'Utilisez la fonction "Générer variantes" qui crée automatiquement les combinaisons taille/couleur avec SKU cohérents.',
        impact: 'high'
      },
      {
        title: 'Ignorer les alertes de doublons',
        description: 'Les doublons cannibalisent vos ventes et créent de la confusion. Fusionnez-les ou archivez les obsolètes.',
        impact: 'medium'
      },
      {
        title: 'Modifier les prix sans vérifier les marges',
        description: 'Activez l\'affichage de la colonne "Marge nette" pour voir l\'impact de chaque modification.',
        impact: 'high'
      }
    ]
  },
  
  troubleshooting: [
    {
      symptom: 'L\'édition inline ne fonctionne pas',
      cause: 'Vous n\'avez pas les droits d\'écriture sur ce produit ou il est verrouillé',
      solution: 'Vérifiez vos permissions dans Paramètres > Équipe ou déverrouillez le produit',
      severity: 'medium'
    },
    {
      symptom: 'L\'import en masse échoue à 50%',
      cause: 'Certaines lignes ont des erreurs de format (prix texte, SKU en double)',
      solution: 'Téléchargez le rapport d\'erreur, corrigez le fichier et relancez uniquement les lignes échouées',
      severity: 'high'
    },
    {
      symptom: 'Le score qualité ne remonte pas malgré les corrections',
      cause: 'Le score est recalculé toutes les 6 heures ou après publication',
      solution: 'Forcez le recalcul via Actions > Recalculer le score',
      severity: 'low'
    },
    {
      symptom: 'Les modifications ne se synchronisent pas avec la marketplace',
      cause: 'La synchronisation automatique est désactivée ou en erreur',
      solution: 'Vérifiez le statut de connexion dans Boutiques & Canaux et relancez la synchro',
      severity: 'high'
    },
    {
      symptom: 'Les images ne s\'affichent pas',
      cause: 'URLs expirées ou images supprimées de la source',
      solution: 'Utilisez Actions > Réimporter les images pour les héberger sur ShopOpti+',
      severity: 'medium'
    }
  ],
  
  expertTips: [
    {
      title: 'La règle du "First 50 Characters"',
      content: 'Les 50 premiers caractères du titre sont les seuls visibles sur mobile. Placez-y marque + produit + différenciateur clé. Le reste est pour le SEO.',
      differentiator: 'ShopOpti+ analyse vos titres et vous alerte si les mots-clés critiques sont trop loin.'
    },
    {
      title: 'Automatisez la saisonnalité',
      content: 'Créez des règles "Si date entre 01/11 et 31/12, ALORS ajouter tag Noël et +10% prix". Désactivez-les automatiquement après.',
      differentiator: 'Notre moteur de règles supporte les conditions temporelles natives.'
    },
    {
      title: 'Le scoring comme KPI d\'équipe',
      content: 'Fixez un objectif de score moyen > 85 à votre équipe catalogue. Gamifiez avec un leaderboard par opérateur.',
      differentiator: 'ShopOpti+ génère des rapports de performance par utilisateur.'
    },
    {
      title: 'Utilisez les bundles intelligents',
      content: 'Créez des packs produits avec prix dynamique (5% de réduction si 3+ articles). L\'IA suggère les meilleures combinaisons basées sur les ventes croisées.',
      differentiator: 'Analyse automatique des patterns d\'achat pour suggérer les bundles les plus rentables.'
    }
  ],
  
  callToValue: {
    headline: 'Divisez par 10 le temps de gestion catalogue',
    description: 'Les outils d\'édition en masse et les règles automatisées de ShopOpti+ transforment des heures de travail manuel en quelques clics. Les agences gèrent 50 000+ produits avec une équipe de 3 personnes.',
    metrics: [
      { label: 'Temps création produit', value: '3 min', improvement: '-85% vs manuel' },
      { label: 'Produits gérés/personne', value: '15 000+', improvement: '+500%' },
      { label: 'Score qualité moyen', value: '88%', improvement: '+35%' }
    ],
    cta: {
      label: 'Gérer mes produits',
      route: '/products'
    }
  },
  
  faqs: [
    {
      question: 'Combien de produits puis-je gérer ?',
      answer: 'Standard: 5 000 produits. Pro: 50 000 produits. Ultra Pro: illimité. Les limites s\'appliquent aux produits actifs uniquement (archivés non comptés).'
    },
    {
      question: 'Puis-je importer depuis Excel ?',
      answer: 'Oui, les formats CSV, XLSX et XML sont supportés. Utilisez Import Pro pour mapper vos colonnes aux champs ShopOpti+ ou utilisez nos templates pré-configurés.'
    },
    {
      question: 'Comment fonctionnent les variantes ?',
      answer: 'Les variantes sont des déclinaisons d\'un produit parent (taille, couleur...). Chaque variante a son propre SKU, stock et prix, mais partage titre, description et images avec le parent.'
    },
    {
      question: 'L\'enrichissement IA est-il inclus ?',
      answer: 'Oui, tous les plans incluent l\'enrichissement IA. Standard: 100 enrichissements/mois. Pro: 1000/mois. Ultra Pro: illimité.'
    }
  ],
  
  relatedModules: ['catalog', 'import', 'pricing', 'channels'],
  externalResources: [
    { label: 'Template d\'import CSV', url: '/templates/product-import' },
    { label: 'Guide SEO produits', url: '/academy/product-seo' }
  ]
};
