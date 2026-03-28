import type { ModuleDocumentation } from '../types';

export const extensionChromeDocumentation: ModuleDocumentation = {
  id: 'extension-chrome',
  slug: 'extension-chrome',
  title: 'Extension Chrome ShopOpti+ Pro',
  subtitle: 'Import intelligent depuis n\'importe quelle page produit',
  description: 'Importez des produits en un clic depuis Amazon, AliExpress, eBay, Temu, TikTok Shop et 12+ plateformes grâce à l\'extension Chrome ShopOpti+ Pro v7.',
  icon: 'Chrome',
  category: 'sourcing',
  routes: ['/extensions', '/import'],
  minPlan: 'standard',
  targetLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
  estimatedReadTime: 12,
  lastUpdated: '2026-03-28',
  version: '7.0.0',
  tags: ['extension', 'chrome', 'import', 'scraping', 'extraction'],
  overview: {
    purpose: 'Extraire et importer automatiquement les données produit (titre, prix, images HD, variantes, avis) depuis n\'importe quelle page fournisseur directement dans votre catalogue ShopOpti+.',
    whenToUse: 'Lorsque vous naviguez sur un site fournisseur et souhaitez importer un ou plusieurs produits sans quitter la page.',
    targetAudience: 'Tous les utilisateurs ShopOpti+ souhaitant accélérer leur sourcing produit.',
    prerequisites: ['Un compte ShopOpti+ actif', 'Google Chrome, Edge, Brave ou Opera (Chromium)', 'Token d\'authentification généré depuis les paramètres'],
    keyFeatures: [
      'Import en 1 clic depuis 17+ plateformes',
      'Extraction HD automatique des images et vidéos',
      'Preview Pro avec score qualité avant import',
      'Import en masse (jusqu\'à 100 produits)',
      'Calcul automatique des marges et prix de vente',
      'Auto-fulfillment et copie d\'adresse',
      'Règles de pricing personnalisables',
      'Fusion IA pour dédupliquer les imports'
    ]
  },
  useCases: [
    {
      level: 'beginner',
      title: 'Importer un produit depuis AliExpress',
      description: 'Naviguez sur AliExpress, cliquez sur l\'icône ShopOpti+ et importez le produit avec toutes ses variantes.',
      steps: ['Ouvrir la page produit AliExpress', 'Cliquer sur le bouton flottant ShopOpti+', 'Vérifier le preview et ajuster la marge', 'Cliquer sur Importer'],
      expectedOutcome: 'Produit importé dans votre catalogue avec images HD, variantes et prix calculé.'
    },
    {
      level: 'intermediate',
      title: 'Import en masse depuis Amazon',
      description: 'Sélectionnez plusieurs produits sur une page de résultats Amazon et importez-les tous en une seule opération.',
      steps: ['Naviguer sur Amazon', 'Activer le mode sélection multiple', 'Cocher les produits souhaités', 'Lancer l\'import groupé'],
      expectedOutcome: 'Jusqu\'à 100 produits importés simultanément avec suivi de progression.'
    },
    {
      level: 'advanced',
      title: 'Auto-fulfillment avec copie d\'adresse',
      description: 'Utilisez le module Address Copier pour remplir automatiquement les formulaires de commande fournisseur.',
      steps: ['Recevoir une commande client', 'Ouvrir la page fournisseur', 'Activer l\'Address Copier', 'Valider la commande pré-remplie'],
      expectedOutcome: 'Commande fournisseur passée en quelques secondes avec l\'adresse client.'
    }
  ],
  stepByStep: [
    { stepNumber: 1, title: 'Télécharger l\'extension', description: 'Rendez-vous dans Paramètres > Extensions pour télécharger le fichier ZIP de l\'extension.', tip: 'L\'extension est compatible Chrome, Edge, Brave et Opera.' },
    { stepNumber: 2, title: 'Installer en mode développeur', description: 'Ouvrez chrome://extensions, activez le mode développeur, puis cliquez sur "Charger l\'extension non empaquetée".', warning: 'Vous devez décompresser le ZIP avant de charger le dossier.' },
    { stepNumber: 3, title: 'Connecter votre compte', description: 'Cliquez sur l\'icône de l\'extension et entrez votre token d\'authentification généré depuis ShopOpti+.', tip: 'Le token est valide 30 jours et se renouvelle automatiquement.' },
    { stepNumber: 4, title: 'Naviguer et importer', description: 'Visitez n\'importe quelle page produit supportée. Le bouton flottant ShopOpti+ apparaît automatiquement.', tip: 'Le score de qualité vous aide à évaluer la fiabilité des données extraites.' },
    { stepNumber: 5, title: 'Configurer les règles de pricing', description: 'Dans les options de l\'extension, définissez vos marges par défaut et vos règles d\'arrondi.' }
  ],
  bestPractices: {
    recommendations: [
      { title: 'Vérifiez le score qualité', description: 'N\'importez que les produits avec un score supérieur à 70% pour garantir des fiches complètes.', impact: 'high' },
      { title: 'Configurez vos marges par défaut', description: 'Définissez une marge minimum de 30% dans les options pour couvrir les frais marketing.', impact: 'high' },
      { title: 'Utilisez le preview avant import', description: 'Le preview Pro vous montre exactement ce qui sera importé avant de valider.', impact: 'medium' }
    ],
    pitfalls: [
      { title: 'Ne pas ignorer les avertissements', description: 'Les alertes de données manquantes signalent des fiches incomplètes qui nécessiteront un enrichissement manuel.', impact: 'medium' },
      { title: 'Token expiré', description: 'Si l\'import échoue, vérifiez que votre token n\'est pas expiré dans les paramètres.', impact: 'high' }
    ]
  },
  troubleshooting: [
    { symptom: 'Le bouton flottant n\'apparaît pas', cause: 'La plateforme n\'est pas détectée ou l\'extension est désactivée.', solution: 'Vérifiez que l\'extension est active dans chrome://extensions et que vous êtes sur une page produit supportée.', severity: 'medium' },
    { symptom: 'Erreur "Token invalide"', cause: 'Le token a expiré ou a été révoqué.', solution: 'Générez un nouveau token depuis Paramètres > Extensions > Générer Token.', severity: 'high' },
    { symptom: 'Import incomplet (images manquantes)', cause: 'Le site bloque le scraping des images haute résolution.', solution: 'L\'extension tente automatiquement un fallback via Jina Reader. Attendez quelques secondes ou réessayez.', severity: 'low' },
    { symptom: 'L\'extension ne se charge pas', cause: 'Fichiers manquants dans le dossier décompressé.', solution: 'Re-téléchargez le ZIP et décompressez-le intégralement avant de charger.', severity: 'high' }
  ],
  expertTips: [
    { title: 'Mode debug', content: 'Activez le mode debug dans les options de l\'extension pour voir les logs détaillés d\'extraction dans la console Chrome.' },
    { title: 'Import en masse stratégique', content: 'Utilisez l\'import en masse sur les pages de recherche pour tester rapidement un nouveau créneau de marché.' }
  ],
  callToValue: {
    headline: 'Importez 10x plus vite avec l\'extension Chrome',
    description: 'L\'extension ShopOpti+ Pro v7 réduit le temps d\'import produit de 15 minutes à moins de 30 secondes.',
    metrics: [
      { label: 'Temps d\'import', value: '< 30s', improvement: '-97%' },
      { label: 'Plateformes supportées', value: '17+' },
      { label: 'Score qualité moyen', value: '85%' }
    ]
  },
  faqs: [
    { question: 'L\'extension fonctionne-t-elle sur Firefox ?', answer: 'Non, l\'extension est compatible uniquement avec les navigateurs basés sur Chromium (Chrome, Edge, Brave, Opera).' },
    { question: 'Combien de produits puis-je importer en une fois ?', answer: 'Le mode import en masse supporte jusqu\'à 100 produits simultanément.' },
    { question: 'Mes données sont-elles sécurisées ?', answer: 'Oui, l\'authentification utilise des tokens JWT avec des scopes granulaires. Aucune donnée n\'est stockée localement.' }
  ],
  relatedModules: ['import', 'products', 'suppliers'],
};
