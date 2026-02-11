import type { ModuleDocumentation } from '../types';

export const dataExportDocumentation: ModuleDocumentation = {
  id: 'dataExport',
  slug: 'data-export',
  title: 'Centre d\'Export de Données',
  subtitle: 'Export multi-format de toutes vos données',
  description: 'Exportez vos produits, commandes et analyses dans le format de votre choix (CSV, XLSX, JSON, XML). Planifiez des exports automatiques et conservez un historique complet.',
  icon: 'Download',
  category: 'enterprise',
  routes: ['/settings/exports'],
  
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced'],
  estimatedReadTime: 6,
  lastUpdated: '2025-06-01',
  version: '1.0',
  tags: ['export', 'csv', 'xlsx', 'json', 'xml', 'données', 'téléchargement'],
  
  overview: {
    purpose: 'Le Centre d\'Export permet de télécharger toutes vos données dans le format adapté à vos besoins : CSV pour Excel, JSON pour les développeurs, XML pour les intégrations.',
    whenToUse: 'Pour la comptabilité, les rapports, la migration de données ou l\'intégration avec des outils tiers.',
    targetAudience: 'Tous les utilisateurs qui ont besoin d\'exploiter leurs données en dehors de ShopOpti+.',
    keyFeatures: [
      '4 formats d\'export : CSV, XLSX, JSON, XML',
      'Export de produits, commandes, clients, analytics',
      'Filtres et sélection de colonnes',
      'Planification d\'exports récurrents',
      'Historique des exports',
      'Compression automatique (ZIP)',
      'Export en arrière-plan pour les gros volumes',
      'Notification quand l\'export est prêt'
    ]
  },
  
  useCases: [
    {
      level: 'beginner',
      title: 'Exporter pour la comptabilité',
      description: 'Exportez vos commandes du mois en CSV pour votre comptable.',
      steps: ['Sélectionnez "Commandes" comme type de données', 'Filtrez par période (mois en cours)', 'Choisissez le format CSV', 'Téléchargez'],
      expectedOutcome: 'Fichier CSV prêt à importer dans votre logiciel comptable.'
    },
    {
      level: 'advanced',
      title: 'Export automatique hebdomadaire',
      description: 'Planifiez un export automatique de vos données chaque lundi matin.',
      steps: ['Configurez un export récurrent', 'Sélectionnez les données et le format', 'Définissez la fréquence : hebdomadaire', 'Les exports seront disponibles dans l\'historique'],
      expectedOutcome: 'Export automatique sans intervention manuelle, disponible chaque lundi.'
    }
  ],
  
  stepByStep: [
    { stepNumber: 1, title: 'Choisir le type de données', description: 'Sélectionnez le jeu de données à exporter : Produits, Commandes, Clients ou Analytics.' },
    { stepNumber: 2, title: 'Appliquer les filtres', description: 'Filtrez par date, statut, catégorie ou tout autre critère disponible.', tip: 'Utilisez les filtres pour exporter uniquement les données pertinentes et réduire la taille du fichier.' },
    { stepNumber: 3, title: 'Sélectionner le format', description: 'Choisissez CSV (tableur), XLSX (Excel), JSON (développeurs) ou XML (intégrations).', tip: 'CSV est le format le plus universel. XLSX est préférable si vous utilisez Excel pour l\'analyse.' },
    { stepNumber: 4, title: 'Lancer l\'export', description: 'Cliquez "Exporter" pour générer le fichier.', tip: 'Les exports de plus de 10 000 lignes sont traités en arrière-plan. Vous serez notifié quand c\'est prêt.' },
    { stepNumber: 5, title: 'Télécharger', description: 'Le fichier est disponible dans l\'historique des exports. Les fichiers expirent après 7 jours.' }
  ],
  
  bestPractices: {
    recommendations: [
      { title: 'Filtrez avant d\'exporter', description: 'Un export ciblé est plus rapide et plus facile à exploiter qu\'un export brut de toutes les données.', impact: 'medium' },
      { title: 'Utilisez les exports planifiés', description: 'Pour les rapports réguliers, planifiez l\'export pour l\'avoir prêt automatiquement.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Export trop volumineux', description: 'Un export de 100 000+ lignes en XLSX peut être lent. Préférez le CSV pour les gros volumes.', impact: 'low' },
      { title: 'Oublier de télécharger', description: 'Les fichiers expirent après 7 jours. Téléchargez-les rapidement.', impact: 'low' }
    ]
  },
  
  troubleshooting: [
    { symptom: 'L\'export est bloqué en "En cours"', cause: 'Volume de données très important', solution: 'Les gros exports peuvent prendre plusieurs minutes. Vous serez notifié quand c\'est terminé.', severity: 'low' },
    { symptom: 'Le fichier CSV a des caractères bizarres', cause: 'Encodage UTF-8 non reconnu par Excel', solution: 'Ouvrez le CSV avec l\'import de données d\'Excel et sélectionnez l\'encodage UTF-8', severity: 'low' }
  ],
  
  expertTips: [
    { title: 'Format optimal par usage', content: 'CSV pour la comptabilité, XLSX pour les rapports visuels, JSON pour les APIs et développeurs, XML pour les ERP legacy. Choisir le bon format évite les conversions et erreurs.', differentiator: 'ShopOpti+ est le seul à proposer les 4 formats avec filtres et planification intégrés.' }
  ],
  
  callToValue: {
    headline: 'Vos données, dans le format qu\'il vous faut',
    description: 'Exportez n\'importe quelles données en 4 formats, avec filtres et planification automatique.',
    metrics: [
      { label: 'Formats supportés', value: '4', improvement: 'CSV, XLSX, JSON, XML' },
      { label: 'Temps d\'export', value: '< 30s', improvement: 'Pour 10 000 lignes' }
    ],
    cta: { label: 'Exporter mes données', route: '/settings/exports' }
  },
  
  faqs: [
    { question: 'Y a-t-il une limite de lignes ?', answer: 'Non, mais les exports de plus de 50 000 lignes sont compressés en ZIP automatiquement.' },
    { question: 'Puis-je choisir les colonnes à exporter ?', answer: 'Oui, vous pouvez sélectionner les colonnes spécifiques pour chaque type de données.' }
  ],
  
  relatedModules: ['analytics', 'settings', 'orders', 'products'],
};
